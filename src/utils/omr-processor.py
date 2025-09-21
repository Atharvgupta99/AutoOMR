#!/usr/bin/env python3
"""
OMR Processing Pipeline
This script processes OMR sheets using OpenCV and Tesseract OCR
"""

import cv2
import numpy as np
import json
import base64
import io
from PIL import Image
import pytesseract
import argparse
import sys

# Configuration
NUM_CHOICES = 4
ROW_TOLERANCE = 20
MIN_BUBBLE_AREA = 100
MAX_BUBBLE_AREA = 3000

def preprocess_image(image):
    """Preprocess the image for better bubble detection"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.medianBlur(gray, 5)
    thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 41, 10)
    
    kernel = np.ones((3, 3), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    return thresh

def is_valid_bubble(c):
    """Check if a contour represents a valid bubble"""
    x, y, w, h = cv2.boundingRect(c)
    area = cv2.contourArea(c)
    
    if area < MIN_BUBBLE_AREA or area > MAX_BUBBLE_AREA:
        return False
        
    aspect = w / float(h)
    if not (0.7 < aspect < 1.3):
        return False
        
    perim = cv2.arcLength(c, True)
    if perim == 0:
        return False
        
    circ = 4 * np.pi * area / (perim ** 2)
    if not (0.6 < circ < 1.4):
        return False
        
    return True

def find_bubbles(thresh):
    """Find all valid bubble contours in the image"""
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    bubbles = [cv2.boundingRect(c) for c in contours if is_valid_bubble(c)]
    
    bubbles.sort(key=lambda b: (b[0], b[1]))
    
    return bubbles

def split_columns(bubbles):
    """Split bubbles into columns based on x-coordinates"""
    if not bubbles:
        return []
    
    xs = [b[0] + b[2] // 2 for b in bubbles]
    diffs = np.diff(xs)
    
    mean_diff = np.mean(diffs)
    std_diff = np.std(diffs)
    threshold = mean_diff + 1.5 * std_diff
    
    split_indices = [i + 1 for i, d in enumerate(diffs) if d > threshold]
    
    columns = []
    start = 0
    for idx in split_indices:
        columns.append(bubbles[start:idx])
        start = idx
    columns.append(bubbles[start:])
    
    return columns

def group_rows(column_bubbles):
    """Group bubbles in a column into rows"""
    column_bubbles.sort(key=lambda b: b[1])
    rows = []
    if not column_bubbles:
        return rows
        
    current_row = [column_bubbles[0]]
    for i in range(1, len(column_bubbles)):
        if abs(column_bubbles[i][1] - current_row[-1][1]) < ROW_TOLERANCE:
            current_row.append(column_bubbles[i])
        else:
            rows.append(current_row)
            current_row = [column_bubbles[i]]
    rows.append(current_row)

    for row in rows:
        row.sort(key=lambda b: b[0])
    
    return rows

def detect_answers(columns, thresh):
    """Detect filled bubbles and return answers"""
    answers = {}
    qnum = 1
    
    for col in columns:
        rows = group_rows(col)
        for row in rows:
            row_choices = row[:NUM_CHOICES]
            max_fill = 0
            filled_idx = -1
            
            for idx, (x, y, w, h) in enumerate(row_choices):
                roi = thresh[y:y+h, x:x+w]
                if w * h > 0:
                    fill = cv2.countNonZero(roi) / float(w * h)
                    if fill > max_fill:
                        max_fill = fill
                        filled_idx = idx
            
            answer = "ABCD"[filled_idx] if filled_idx != -1 and max_fill >= 0.45 else None
            answers[qnum] = answer
            qnum += 1
            
    return answers

def order_points(pts):
    """Order the four corner points of a rectangle for perspective transform"""
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    
    return rect

def auto_crop_top(image):
    """Automatically crop the top section of the OMR sheet"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 41, 10)
    
    rows, cols = thresh.shape
    row_sum = np.sum(thresh > 0, axis=1)
    
    start_y = 0
    for i in range(rows):
        if row_sum[i] > cols * 0.1:
            start_y = i
            break
            
    start_y = max(0, start_y - 20)
    
    return image[start_y:, :]

def process_omr_image(image_data):
    """Main function to process OMR image and return detected answers"""
    try:
        # Decode base64 image
        if isinstance(image_data, str) and image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Initialize variables
        answers = {}
        
        orig_thresh = preprocess_image(image)
        
        # Find contours and filter for a good-sized, 4-point contour
        contours, _ = cv2.findContours(orig_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        sheet_contour = None
        for c in sorted(contours, key=cv2.contourArea, reverse=True):
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            
            if len(approx) == 4 and cv2.contourArea(c) > (image.shape[0] * image.shape[1] * 0.1):
                sheet_contour = approx
                break
                
        if sheet_contour is None:
            print("Could not find valid 4-point contour. Using original image.")
            image_corrected = image
        else:
            src_points = order_points(np.float32([p[0] for p in sheet_contour]))
            
            # Calculate aspect ratio and new dimensions
            (tl, tr, br, bl) = src_points
            width = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
            height = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
            
            dst_points = np.float32([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]])
            
            M = cv2.getPerspectiveTransform(src_points, dst_points)
            image_corrected = cv2.warpPerspective(image, M, (int(width), int(height)))
            
            # Check if corrected image is valid
            if np.mean(cv2.cvtColor(image_corrected, cv2.COLOR_BGR2GRAY)) < 30:
                print("Perspective correction failed. Using original image.")
                image_corrected = image
                
        # Auto-crop the top header section
        image_cropped = auto_crop_top(image_corrected)
        thresh_cropped = preprocess_image(image_cropped)

        # Find and process bubbles
        bubbles = find_bubbles(thresh_cropped)
        if not bubbles:
            print("No bubbles detected. Check parameters.")
            answers = {q: None for q in range(1, 101)}
        else:
            columns = split_columns(bubbles)
            answers = detect_answers(columns, thresh_cropped)

        return {
            'success': True,
            'answers': answers,
            'total_detected': len([a for a in answers.values() if a is not None]),
            'detection_rate': len([a for a in answers.values() if a is not None]) / 100.0
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'answers': {}
        }

def main():
    """Main function for command line usage"""
    parser = argparse.ArgumentParser(description='Process OMR sheet')
    parser.add_argument('--image', required=True, help='Path to OMR image file')
    parser.add_argument('--output', default='detected_answers.json', help='Output JSON file')
    
    args = parser.parse_args()
    
    try:
        # Read image file
        with open(args.image, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        # Process the image
        result = process_omr_image(image_data)
        
        # Save results
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"Results saved to {args.output}")
        print(f"Detection rate: {result.get('detection_rate', 0):.2%}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
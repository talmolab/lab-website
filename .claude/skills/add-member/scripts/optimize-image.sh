#!/bin/bash
# Image optimization script for lab member profile photos
# Resizes images to appropriate dimensions and optimizes file size for web display

set -e

# Default values
MAX_DIMENSION=500
QUALITY=85

# Usage information
usage() {
    cat << EOF
Usage: $0 <input_image> <output_image> [max_dimension] [quality]

Optimizes profile images for the lab website.

Arguments:
    input_image     Path to input image file
    output_image    Path to output image file
    max_dimension   Maximum width/height in pixels (default: 500)
    quality         JPEG quality 1-100 (default: 85)

Examples:
    $0 photo.jpg images/john-doe.jpg
    $0 photo.png images/jane-smith.jpg 600 90
    $0 large.jpg images/alex-chen.jpg 400

Requirements:
    - macOS: Uses 'sips' (built-in)
    - Linux: Uses 'convert' from ImageMagick (must be installed)

EOF
    exit 1
}

# Check arguments
if [ $# -lt 2 ]; then
    usage
fi

INPUT="$1"
OUTPUT="$2"
MAX_DIMENSION="${3:-$MAX_DIMENSION}"
QUALITY="${4:-$QUALITY}"

# Validate input file exists
if [ ! -f "$INPUT" ]; then
    echo "Error: Input file '$INPUT' not found"
    exit 1
fi

# Create output directory if it doesn't exist
OUTPUT_DIR=$(dirname "$OUTPUT")
mkdir -p "$OUTPUT_DIR"

# Detect platform and available tools
if command -v sips &> /dev/null; then
    # macOS - use sips
    echo "Using sips (macOS)..."

    # Resize to max dimension, maintaining aspect ratio
    sips -Z "$MAX_DIMENSION" "$INPUT" --out "$OUTPUT" > /dev/null

    # Convert to JPEG if not already (and set quality)
    sips -s format jpeg -s formatOptions "$QUALITY" "$OUTPUT" --out "$OUTPUT" > /dev/null

    echo "✓ Optimized: $OUTPUT"

    # Show file info
    echo "Dimensions: $(sips -g pixelWidth -g pixelHeight "$OUTPUT" | grep -E 'pixelWidth|pixelHeight' | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')"
    echo "File size: $(du -h "$OUTPUT" | cut -f1)"

elif command -v convert &> /dev/null; then
    # Linux/other - use ImageMagick
    echo "Using ImageMagick convert..."

    # Resize to max dimension and convert to JPEG
    convert "$INPUT" -resize "${MAX_DIMENSION}x${MAX_DIMENSION}" -quality "$QUALITY" "$OUTPUT"

    echo "✓ Optimized: $OUTPUT"

    # Show file info (if identify is available)
    if command -v identify &> /dev/null; then
        echo "Dimensions: $(identify -format '%wx%h' "$OUTPUT")"
    fi
    echo "File size: $(du -h "$OUTPUT" | cut -f1)"

else
    echo "Error: No image manipulation tool found"
    echo ""
    echo "Please install one of the following:"
    echo "  - macOS: sips (pre-installed)"
    echo "  - Linux: ImageMagick (apt-get install imagemagick / yum install ImageMagick)"
    exit 1
fi

echo ""
echo "Image optimization complete!"

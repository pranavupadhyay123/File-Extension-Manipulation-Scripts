from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image
import io
import os
import zipfile
import img2pdf
from pdf2image import convert_from_path
from werkzeug.utils import secure_filename
import tempfile
import uuid

app = Flask(__name__)
CORS(app) # Enable CORS for development

UPLOAD_FOLDER = tempfile.gettempdir()
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "FileFlow API"}), 200

@app.route('/api/compress', methods=['POST'])
def compress():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    quality = int(request.form.get('quality', 70))
    format_type = request.form.get('format', 'JPEG').upper()
    
    try:
        image = Image.open(file)
        if image.mode in ("RGBA", "P") and format_type == 'JPEG':
            image = image.convert("RGB")
        
        output = io.BytesIO()
        image.save(output, format=format_type, optimize=True, quality=quality)
        output.seek(0)
        
        ext = format_type.lower()
        return send_file(
            output,
            mimetype=f'image/{ext}',
            as_attachment=True,
            download_name=f'compressed_image.{ext}'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/crop', methods=['POST'])
def crop():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    try:
        image = Image.open(file)
        # Auto-crop based on bounding box (removes empty borders)
        cropped_image = image.crop(image.getbbox())
        
        output = io.BytesIO()
        cropped_image.save(output, format=image.format)
        output.seek(0)
        
        return send_file(
            output,
            mimetype=f'image/{image.format.lower()}',
            as_attachment=True,
            download_name=f'cropped_{file.filename}'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/pdf-maker', methods=['POST'])
def pdf_maker():
    if 'files' not in request.files:
        return jsonify({"error": "No files uploaded"}), 400
    
    files = request.files.getlist('files')
    if not files:
        return jsonify({"error": "No files selected"}), 400
    
    temp_dir = tempfile.mkdtemp()
    image_paths = []
    
    try:
        for file in files:
            filename = secure_filename(file.filename)
            path = os.path.join(temp_dir, filename)
            file.save(path)
            image_paths.append(path)
        
        pdf_bytes = img2pdf.convert(image_paths)
        output = io.BytesIO(pdf_bytes)
        
        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='converted_images.pdf'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup
        for path in image_paths:
            if os.path.exists(path):
                os.remove(path)
        if os.path.exists(temp_dir):
            os.rmdir(temp_dir)

@app.route('/api/pdf-to-jpg', methods=['POST'])
def pdf_to_jpg():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    temp_dir = tempfile.mkdtemp()
    pdf_path = os.path.join(temp_dir, secure_filename(file.filename))
    file.save(pdf_path)
    
    try:
        images = convert_from_path(pdf_path)
        
        if len(images) == 1:
            output = io.BytesIO()
            images[0].save(output, format='JPEG')
            output.seek(0)
            return send_file(
                output,
                mimetype='image/jpeg',
                as_attachment=True,
                download_name='page_1.jpg'
            )
        else:
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
                for i, image in enumerate(images):
                    img_io = io.BytesIO()
                    image.save(img_io, format='JPEG')
                    zip_file.writestr(f'page_{i+1}.jpg', img_io.getvalue())
            
            zip_buffer.seek(0)
            return send_file(
                zip_buffer,
                mimetype='application/zip',
                as_attachment=True,
                download_name='converted_pdf_pages.zip'
            )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        if os.path.exists(temp_dir):
            os.rmdir(temp_dir)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

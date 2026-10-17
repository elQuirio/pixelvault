from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from transformers import AutoModel, AutoProcessor
from PIL import Image, ImageOps
import os

app = FastAPI()

MODEL_NAME = "google/siglip2-base-patch16-224"
model = AutoModel.from_pretrained(MODEL_NAME).eval()
processor = AutoProcessor.from_pretrained(MODEL_NAME)

class TextRequest(BaseModel):
    text: str

class ImageRequest(BaseModel):
    path: str

@app.post("/embed/text")
def embed_text(req: TextRequest):
    inputs = processor(text=[req.text], padding="max_length", max_length=64, return_tensors="pt")
    with torch.no_grad():
        vector = model.get_text_features(**inputs)
    vector = vector / vector.norm(dim=-1, keepdim=True)
    return {"embeddings": vector[0].tolist()}


@app.post("/embed/image")
def embed_images(req: ImageRequest):
    if not os.path.exists(req.path):
        raise HTTPException(status_code=404, detail='Item not found')
    image = Image.open(req.path).convert("RGB")
    image = ImageOps.exif_transpose(image)
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        vectors = model.get_image_features(**inputs)
    vectors = vectors / vectors.norm(dim=-1, keepdim=True)
    return {"embeddings": vectors[0].tolist()}
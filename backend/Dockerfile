FROM python:3.9-slim

# Instalamos compiladores nativos de Linux para WeasyPrint y BD
RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    python3-dev \
    python3-pip \
    python3-cffi \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info

WORKDIR /app

COPY req.txt .
RUN pip install --no-cache-dir -r req.txt

COPY . .

# Exponemos el servidor
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

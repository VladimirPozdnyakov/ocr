# Установка Python 3.12 на Arch Linux

Для работы Theseus (PaddleOCR) требуется Python 3.7-3.12, но на Arch Linux по умолчанию установлен Python 3.14.

## Решение: Установка Python 3.12 параллельно

### Вариант 1: Через yay (рекомендуется)

```bash
yay -S python312
```

### Вариант 2: Через paru

```bash
paru -S python312
```

### Вариант 3: Вручную из AUR

```bash
git clone https://aur.archlinux.org/python312.git
cd python312
makepkg -si
```

## После установки

После установки Python 3.12, снова запустите скрипт установки:

```bash
npm run install:ocr
```

Скрипт автоматически обнаружит Python 3.12 и использует его для PaddleOCR.

## Проверка

```bash
# Проверить, что Python 3.12 установлен
python3.12 --version

# Должно показать: Python 3.12.x
```

## Если не хотите устанавливать Python 3.12

Вы можете использовать только Ortheus (Tesseract) и MangaOCR:

```bash
npm run install:ocr
# Выберите опцию 5 (Custom selection)
# Установите только Ortheus и MangaOCR
```

## Почему это безопасно?

- Python 3.12 устанавливается параллельно с Python 3.14
- Системный Python остаётся версии 3.14
- Python 3.12 используется только для PaddleOCR в виртуальном окружении
- Это не влияет на работу системы

## Альтернатива: Использовать Docker

Если вы не хотите устанавливать Python 3.12, можно использовать Docker:

```bash
# Создайте Dockerfile
cat > Dockerfile.ocr << 'EOF'
FROM python:3.12-slim
RUN pip install paddleocr paddlepaddle opencv-python
CMD ["paddleocr", "--help"]
EOF

# Соберите образ
docker build -f Dockerfile.ocr -t ocr-paddleocr .

# Используйте для OCR
docker run --rm -v $(pwd):/data ocr-paddleocr --image_dir /data/image.png
```

Однако этот подход сложнее интегрировать с приложением.

## Удаление Python 3.12

Если позже захотите удалить Python 3.12:

```bash
yay -R python312
# или
paru -R python312
```

Или при ручной установке из AUR:
```bash
cd python312
makepkg -R
```

## Примечание

- Эти инструкции специфичны для Arch Linux и его производных
- На других дистрибутивах (Ubuntu, Fedora и т.д.) эта проблема не возникает
- MangaOCR работает с Python 3.14, поэтому он не требует Python 3.12

import { useRef, useState } from 'react';
import { estimateMealPhoto } from '../data/nutritionRepository';
import type { PlanProduct } from '../types/recipe';

type PhotoMealCaptureProps = {
  disabled?: boolean;
  onRecognized: (products: PlanProduct[], notice: string) => void;
};

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1280;

const readImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('IMAGE_DECODE_FAILED'));
    };
    image.src = objectUrl;
  });

const prepareImage = async (file: File) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('UNSUPPORTED_IMAGE');
  }
  if (file.size > MAX_SOURCE_BYTES) throw new Error('IMAGE_TOO_LARGE');

  const image = await readImage(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('IMAGE_PROCESSING_FAILED');
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.78);
};

export function PhotoMealCapture({ disabled, onRecognized }: PhotoMealCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setIsAnalyzing(true);
    try {
      const imageDataUrl = await prepareImage(file);
      setPreview(imageDataUrl);
      const result = await estimateMealPhoto(imageDataUrl);
      onRecognized(result.products, result.notice);
    } catch (photoError) {
      console.error('Meal photo recognition failed', photoError);
      const message = photoError instanceof Error && photoError.message === 'IMAGE_TOO_LARGE'
        ? 'Фото слишком большое. Выберите снимок размером до 10 МБ.'
        : 'Не удалось распознать фото. Попробуйте другой снимок.';
      setError(message);
    } finally {
      setIsAnalyzing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return <section className="mt-5 rounded-3xl border border-[#5C8A1E]/30 bg-[#14170F]/35 p-4">
    <input
      ref={inputRef}
      className="hidden"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      capture="environment"
      onChange={(event) => void handleFile(event.target.files?.[0])}
    />
    <p className="text-sm font-black text-[#F4F7EE]">Добавить по фотографии</p>
    <p className="mt-1 text-xs font-semibold leading-5 text-[#A9B39C]">Сфотографируйте тарелку или выберите снимок. ИИ предложит состав, вес и КБЖУ — всё можно исправить до сохранения.</p>
    {preview && <img className="mt-3 h-36 w-full rounded-2xl object-cover" src={preview} alt="Фото для распознавания" />}
    <button
      className="mt-3 w-full rounded-2xl bg-[#5C8A1E] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
      disabled={disabled || isAnalyzing}
      onClick={() => inputRef.current?.click()}
      type="button"
    >
      {isAnalyzing ? 'Распознаём…' : preview ? '📷 Выбрать другое фото' : '📷 Распознать по фото'}
    </button>
    <p className="mt-2 text-[11px] font-semibold leading-4 text-[#A9B39C]">Снимок используется только для текущего распознавания и не сохраняется в приложении.</p>
    {error && <p className="mt-3 rounded-2xl bg-[#8FD14C]/15 px-3 py-2 text-xs font-bold text-[#E7B24A]">{error}</p>}
  </section>;
}

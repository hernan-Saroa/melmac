import { useRef, useState, useEffect } from 'react';
import { Eraser, CheckCircle2 } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signatureBase64: string) => void;
  initialValue?: string;
}

export default function SignaturePad({ onSignatureChange, initialValue }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialValue);

  useEffect(() => {
    // If there's an initial value (base64 image), draw it
    if (initialValue && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = initialValue;
      }
    }
  }, [initialValue]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e) ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = ('clientY' in e) ? e.clientY - rect.top : e.touches[0].clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e) ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = ('clientY' in e) ? e.clientY - rect.top : e.touches[0].clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#312e81'; // text-indigo-900

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setHasSignature(true);
      onSignatureChange(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasSignature(false);
      onSignatureChange('');
    }
  };

  return (
    <div className="relative border-2 border-dashed border-indigo-200 bg-white rounded-2xl overflow-hidden group">
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        className="w-full h-[200px] touch-none cursor-crosshair bg-indigo-50/30"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      {!hasSignature && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-indigo-300">
          <span className="text-sm font-medium">Dibuja tu firma aquí</span>
        </div>
      )}

      {hasSignature && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Capturada
          </span>
          <button
            type="button"
            onClick={clearSignature}
            className="p-1.5 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors"
            title="Borrar firma"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

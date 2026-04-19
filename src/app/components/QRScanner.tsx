import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, QrCode, Camera, Keyboard } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  useEffect(() => {
    if (manualMode) return;

    const scanner = new Html5Qrcode(qrCodeRegionId);
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop();
          },
          (errorMessage) => {
            // Erro silencioso durante a leitura
          }
        );
        setIsScanning(true);
        setError(null);
      } catch (err) {
        // Câmera não disponível - mostra mensagem e muda para modo manual
        setError("Câmera não encontrada. Por favor, insira o código manualmente.");
        setTimeout(() => {
          setManualMode(true);
        }, 2000);
      }
    };

    startScanner();

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(() => {
          // Ignora erros ao parar o scanner
        });
      }
    };
  }, [onScan, manualMode]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        {!manualMode ? (
          <>
            <div className="flex items-center gap-2 text-white">
              <QrCode className="w-6 h-6" />
              <span className="text-xl">Escaneie o QR Code</span>
            </div>
            
            <div 
              id={qrCodeRegionId} 
              className="rounded-lg overflow-hidden border-4 border-white shadow-2xl w-full"
            />
            
            {!isScanning && !error && (
              <p className="text-white/70 text-sm">Iniciando câmera...</p>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={() => setManualMode(true)}
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Inserir código manualmente
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-white">
              <Keyboard className="w-6 h-6" />
              <span className="text-xl">Inserir Código</span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 w-full">
              <label className="text-white text-sm mb-2 block">
                Digite o código do QR:
              </label>
              <Input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                placeholder="Ex: FASE_2"
                className="bg-white text-black mb-4"
                autoFocus
              />
              <Button
                onClick={handleManualSubmit}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                Confirmar
              </Button>
            </div>

            <Button
              onClick={() => setManualMode(false)}
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <Camera className="w-4 h-4 mr-2" />
              Usar câmera
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
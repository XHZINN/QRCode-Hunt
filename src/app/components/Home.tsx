import { useState } from 'react';
import { LearningPath } from './LearningPath';
import { QRScanner } from './QRScanner';
import { PageHeader } from './PageHeader';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface Phase {
  id: number;
  title: string;
  icon: 'book' | 'star' | 'trophy';
  status: 'completed' | 'current' | 'locked';
}

export function Home() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [showScanner, setShowScanner] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([
    { id: 1, title: 'Fundamentos Básicos', icon: 'book', status: 'current' },
    { id: 2, title: 'Conceitos Intermediários', icon: 'star', status: 'locked' },
    { id: 3, title: 'Técnicas Avançadas', icon: 'star', status: 'locked' },
    { id: 4, title: 'Projeto Final', icon: 'trophy', status: 'locked' },
    { id: 5, title: 'Especialização', icon: 'trophy', status: 'locked' },
  ]);

  const handleQRScan = (data: string) => {
    setShowScanner(false);

    // Simula validação do QR Code
    if (data && data.length > 0) {
      // Avança para a próxima fase
      if (currentPhase <= phases.length) {
        const newPhase = currentPhase + 1;

        // Atualiza o status das fases
        setPhases(prev => prev.map(phase => {
          if (phase.id < newPhase) {
            return { ...phase, status: 'completed' };
          } else if (phase.id === newPhase) {
            return { ...phase, status: 'current' };
          }
          return phase;
        }));

        setCurrentPhase(newPhase);

        // Celebração com confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        if (currentPhase === phases.length) {
          toast.success('Você completou todas as fases! 🏆');
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.5 }
          });
        } else {
          toast.success(`Parabéns! Você avançou para a Fase ${newPhase}! 🎉`);
        }
      }
    } else {
      toast.error('QR Code inválido. Tente novamente.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Trilha de Aprendizado"
        subtitle="Sua jornada de código"
        rightContent={
          <div className="bg-gradient-to-r from-blue-100 to-purple-200 px-4 py-2 rounded-full border-2 border-purple-400">
            <span className="text-sm font-bold bg-gradient-to-r from-blue-700 to-purple-800 bg-clip-text text-transparent">
              Fase {currentPhase} de {phases.length}
            </span>
          </div>
        }
      />

      {/* Conteúdo principal */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Card de progresso */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border-2 border-purple-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                Seu Progresso
              </h2>
              <p className="text-sm text-gray-600">
                {Math.round((phases.filter(p => p.status === 'completed').length / phases.length) * 100)}% completo
              </p>
            </div>
            <div className="text-4xl">
              {currentPhase === phases.length ? '🏆' : '💻'}
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 h-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${(phases.filter(p => p.status === 'completed').length / phases.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Trilha de aprendizado */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 p-6 text-white">
            <h2 className="text-2xl font-black">Trilha de Aprendizado</h2>
            <p className="text-blue-50">Complete cada fase para avançar</p>
          </div>
          
          <LearningPath phases={phases} currentPhase={currentPhase} />
        </div>

        {/* Botão de scanner */}
        {currentPhase <= phases.length && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowScanner(true)}
              className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 border-b-4 border-purple-800 hover:border-purple-900 active:translate-y-1"
            >
              <QrCode className="w-6 h-6" />
              Escanear QR Code para Avançar
            </button>
          </div>
        )}

        {currentPhase > phases.length && (
          <div className="text-center p-8 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl border-2 border-yellow-300">
            <div className="text-6xl mb-4">🎊</div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">
              Parabéns!
            </h3>
            <p className="text-gray-700">
              Você completou toda a trilha de aprendizado!
            </p>
          </div>
        )}
      </main>

      {/* Scanner de QR Code */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

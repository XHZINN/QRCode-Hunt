import { Lock, Check, Star, Trophy, Book } from 'lucide-react';

interface Phase {
  id: number;
  title: string;
  icon: 'book' | 'star' | 'trophy';
  status: 'completed' | 'current' | 'locked';
}

interface LearningPathProps {
  phases: Phase[];
  currentPhase: number;
}

export function LearningPath({ phases, currentPhase }: LearningPathProps) {
  const getIcon = (icon: Phase['icon']) => {
    switch (icon) {
      case 'book':
        return Book;
      case 'star':
        return Star;
      case 'trophy':
        return Trophy;
      default:
        return Book;
    }
  };

  return (
    <div className="relative py-12 px-6">
      {/* Linha de conexão */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-200 -translate-x-1/2" />

      <div className="relative space-y-8">
        {phases.map((phase, index) => {
          const Icon = getIcon(phase.icon);
          const isLeft = index % 2 === 0;

          return (
            <div
              key={phase.id}
              className={`flex items-center gap-6 ${
                isLeft ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              {/* Espaçador */}
              <div className="flex-1" />

              {/* Círculo da fase */}
              <div className="relative z-10">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    phase.status === 'completed'
                      ? 'bg-gradient-to-br from-blue-400 to-purple-700 shadow-lg shadow-purple-600/50'
                      : phase.status === 'current'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-pink-500/50 animate-pulse'
                      : 'bg-gray-300'
                  }`}
                >
                  {phase.status === 'completed' ? (
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  ) : phase.status === 'locked' ? (
                    <Lock className="w-8 h-8 text-gray-500" />
                  ) : (
                    <Icon className="w-8 h-8 text-white" />
                  )}
                </div>

                {/* Estrelinhas de celebração para fase atual */}
                {phase.status === 'current' && (
                  <>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping delay-150" />
                  </>
                )}
              </div>

              {/* Informações da fase */}
              <div className="flex-1">
                <div
                  className={`p-4 rounded-xl ${
                    phase.status === 'completed'
                      ? 'bg-green-50 border-2 border-green-200'
                      : phase.status === 'current'
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'bg-gray-100 border-2 border-gray-200'
                  } ${isLeft ? 'text-right' : 'text-left'}`}
                >
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                    Fase {phase.id}
                  </div>
                  <div
                    className={`font-bold ${
                      phase.status === 'locked' ? 'text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {phase.title}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
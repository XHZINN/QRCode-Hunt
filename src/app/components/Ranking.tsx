import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { PageHeader } from './PageHeader';

interface RankingUser {
  id: number;
  name: string;
  avatar: string;
  progress: number;
  phase: number;
  totalPhases: number;
  points: number;
}

const mockUsers: RankingUser[] = [
  { id: 1, name: 'Ana Silva', avatar: '👩‍💻', progress: 100, phase: 5, totalPhases: 5, points: 2500 },
  { id: 2, name: 'Carlos Souza', avatar: '👨‍💻', progress: 80, phase: 4, totalPhases: 5, points: 2000 },
  { id: 3, name: 'Mariana Costa', avatar: '👩‍🎓', progress: 80, phase: 4, totalPhases: 5, points: 1950 },
  { id: 4, name: 'João Pedro', avatar: '🧑‍💻', progress: 60, phase: 3, totalPhases: 5, points: 1500 },
  { id: 5, name: 'Beatriz Lima', avatar: '👩‍🔬', progress: 60, phase: 3, totalPhases: 5, points: 1450 },
  { id: 6, name: 'Rafael Santos', avatar: '👨‍🎓', progress: 40, phase: 2, totalPhases: 5, points: 1000 },
  { id: 7, name: 'Juliana Alves', avatar: '👩', progress: 40, phase: 2, totalPhases: 5, points: 950 },
  { id: 8, name: 'Lucas Oliveira', avatar: '🧑', progress: 20, phase: 1, totalPhases: 5, points: 500 },
  { id: 9, name: 'Camila Rocha', avatar: '👩‍💼', progress: 20, phase: 1, totalPhases: 5, points: 450 },
  { id: 10, name: 'Pedro Henrique', avatar: '👨', progress: 20, phase: 1, totalPhases: 5, points: 400 },
];

export function Ranking() {
  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-7 h-7 text-gray-400" />;
      case 3:
        return <Medal className="w-7 h-7 text-amber-700" />;
      default:
        return <span className="text-2xl font-black text-gray-400">#{position}</span>;
    }
  };

  const getRankBg = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-400 shadow-lg shadow-yellow-200/50';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 border-gray-400 shadow-md';
      case 3:
        return 'bg-gradient-to-r from-orange-100 to-amber-100 border-amber-600 shadow-md';
      default:
        return 'bg-white border-gray-200 hover:border-purple-300';
    }
  };

  return (
    <div>
      <PageHeader
        title="Ranking Global"
        subtitle="Veja quem está liderando"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
        <div className="inline-block bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 p-4 rounded-full mb-4">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent mb-2">
          Ranking Global
        </h1>
        <p className="text-gray-600">Veja quem está liderando a trilha de aprendizado</p>
      </div>

      {/* Podium - Top 3 */}
      <div className="grid grid-cols-3 gap-6 mb-12 items-end">
        {/* 2º Lugar */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-gray-200 to-slate-300 rounded-2xl p-5 border-4 border-gray-400 shadow-xl transform hover:scale-105 transition-transform">
            <div className="text-4xl mb-2">{mockUsers[1].avatar}</div>
            <Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-2xl font-black text-gray-600 mb-1">2º</div>
            <div className="font-bold text-gray-800 text-sm">{mockUsers[1].name}</div>
            <div className="text-xs text-gray-600 mt-1">{mockUsers[1].points} pts</div>
          </div>
        </div>

        {/* 1º Lugar */}
        <div className="text-center -mt-4">
          <div className="bg-gradient-to-br from-yellow-200 via-yellow-300 to-amber-400 rounded-2xl p-6 border-4 border-yellow-500 shadow-2xl transform hover:scale-105 transition-transform relative">
            <Crown className="w-10 h-10 text-yellow-600 mx-auto mb-2 animate-pulse" />
            <div className="text-5xl mb-2">{mockUsers[0].avatar}</div>
            <div className="text-3xl font-black text-yellow-700 mb-1">1º</div>
            <div className="font-bold text-gray-800">{mockUsers[0].name}</div>
            <div className="text-sm text-gray-700 mt-1 font-bold">{mockUsers[0].points} pts</div>
            <div className="absolute -top-2 -right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              LÍDER
            </div>
          </div>
        </div>

        {/* 3º Lugar */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-orange-200 to-amber-300 rounded-2xl p-5 border-4 border-amber-600 shadow-xl transform hover:scale-105 transition-transform">
            <div className="text-4xl mb-2">{mockUsers[2].avatar}</div>
            <Medal className="w-8 h-8 text-amber-700 mx-auto mb-2" />
            <div className="text-2xl font-black text-amber-800 mb-1">3º</div>
            <div className="font-bold text-gray-800 text-sm">{mockUsers[2].name}</div>
            <div className="text-xs text-gray-600 mt-1">{mockUsers[2].points} pts</div>
          </div>
        </div>
      </div>

      {/* Lista completa */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 p-4 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Classificação Completa
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {mockUsers.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 p-5 transition-all duration-200 border-2 ${getRankBg(index + 1)}`}
            >
              {/* Posição */}
              <div className="flex items-center justify-center w-16">
                {getRankIcon(index + 1)}
              </div>

              {/* Avatar e Nome */}
              <div className="flex items-center gap-3 flex-1">
                <div className="text-4xl">{user.avatar}</div>
                <div>
                  <div className="font-bold text-gray-800">{user.name}</div>
                  <div className="text-sm text-gray-600">
                    Fase {user.phase} de {user.totalPhases}
                  </div>
                </div>
              </div>

              {/* Progresso */}
              <div className="flex-1 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 h-full transition-all duration-500"
                      style={{ width: `${user.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-12">
                    {user.progress}%
                  </span>
                </div>
              </div>

              {/* Pontos */}
              <div className="text-right">
                <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                  {user.points}
                </div>
                <div className="text-xs text-gray-500">pontos</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-xl border-2 border-blue-300">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-black text-blue-800">{mockUsers.length}</div>
          <div className="text-sm text-blue-700">Participantes</div>
        </div>

        <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-xl border-2 border-purple-300">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-2xl font-black text-purple-800">
            {mockUsers.filter(u => u.progress === 100).length}
          </div>
          <div className="text-sm text-purple-700">Completaram</div>
        </div>

        <div className="bg-gradient-to-br from-pink-100 to-pink-200 p-6 rounded-xl border-2 border-pink-300">
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-2xl font-black text-pink-800">
            {Math.round(mockUsers.reduce((acc, u) => acc + u.progress, 0) / mockUsers.length)}%
          </div>
          <div className="text-sm text-pink-700">Média Geral</div>
        </div>
      </div>
    </div>
    </div>
  );
}

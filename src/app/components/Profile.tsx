import { useState } from 'react';
import { PageHeader } from './PageHeader';
import { User, Mail, Calendar, Phone, Camera, Save } from 'lucide-react';
import { toast } from 'sonner';

const avatarOptions = ['👨‍💻', '👩‍💻', '🧑‍💻', '👩‍🎓', '👨‍🎓', '🧑‍🎓', '👩‍🔬', '👨‍🔬', '🧑‍🔬', '👩‍💼', '👨‍💼', '🧑‍💼', '🦸‍♀️', '🦸‍♂️', '🦸', '🧙‍♀️', '🧙‍♂️', '🧙'];

export function Profile() {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Seu Nome',
    email: 'seuemail@exemplo.com',
    birthDate: '2000-01-01',
    phone: '(11) 99999-9999',
    avatar: '👨‍💻'
  });

  const handleSave = () => {
    toast.success('Perfil atualizado com sucesso! ✅');
  };

  const handleAvatarChange = (newAvatar: string) => {
    setUserData({ ...userData, avatar: newAvatar });
    setShowAvatarPicker(false);
    toast.success('Avatar atualizado! 🎭');
  };

  return (
    <div>
      <PageHeader
        title="Meu Perfil"
        subtitle="Gerencie suas informações pessoais"
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Card do Avatar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-purple-300 p-8 mb-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center text-7xl shadow-2xl">
                {userData.avatar}
              </div>
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border-4 border-white"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent mt-4">
              {userData.name}
            </h2>
            <p className="text-gray-600 text-sm">{userData.email}</p>
          </div>

          {/* Seletor de Avatar */}
          {showAvatarPicker && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-purple-200">
              <p className="text-sm font-bold text-gray-700 mb-3 text-center">Escolha seu avatar:</p>
              <div className="grid grid-cols-6 gap-3">
                {avatarOptions.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => handleAvatarChange(avatar)}
                    className={`text-4xl p-3 rounded-xl hover:bg-purple-200 transition-all duration-200 hover:scale-110 ${
                      userData.avatar === avatar ? 'bg-purple-300 scale-110' : 'bg-white'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Formulário de Informações */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 p-6 text-white">
            <h2 className="text-2xl font-black">Informações Pessoais</h2>
            <p className="text-blue-50">Mantenha seus dados atualizados</p>
          </div>

          <div className="p-8 space-y-6">
            {/* Nome */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <User className="w-4 h-4 text-purple-600" />
                Nome Completo
              </label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none transition-colors bg-white"
                placeholder="Digite seu nome completo"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-purple-600" />
                E-mail
              </label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none transition-colors bg-white"
                placeholder="seu@email.com"
              />
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Data de Nascimento
              </label>
              <input
                type="date"
                value={userData.birthDate}
                onChange={(e) => setUserData({ ...userData, birthDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none transition-colors bg-white"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Phone className="w-4 h-4 text-purple-600" />
                Telefone
              </label>
              <input
                type="tel"
                value={userData.phone}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none transition-colors bg-white"
                placeholder="(00) 00000-0000"
              />
            </div>

            {/* Botão Salvar */}
            <button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 border-b-4 border-purple-800 hover:border-purple-900 active:translate-y-1"
            >
              <Save className="w-5 h-5" />
              Salvar Alterações
            </button>
          </div>
        </div>

        {/* Estatísticas do Usuário */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-xl border-2 border-blue-300">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-2xl font-black text-blue-800">3</div>
            <div className="text-sm text-blue-700">Fases Concluídas</div>
          </div>

          <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-xl border-2 border-purple-300">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-black text-purple-800">1500</div>
            <div className="text-sm text-purple-700">Pontos Totais</div>
          </div>

          <div className="bg-gradient-to-br from-pink-100 to-pink-200 p-6 rounded-xl border-2 border-pink-300">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-black text-pink-800">7</div>
            <div className="text-sm text-pink-700">Dias de Sequência</div>
          </div>
        </div>
      </div>
    </div>
  );
}

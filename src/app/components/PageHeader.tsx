import { useSidebar } from './ui/sidebar';
import logoImage from '../../imports/images.jfif';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  rightContent?: React.ReactNode;
}

export function PageHeader({ title, subtitle, rightContent }: PageHeaderProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b-4 border-gradient-to-r from-blue-500 to-purple-700 shadow-lg sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="w-12 h-12 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <img
              src={logoImage}
              alt="Menu QuestCode"
              className="w-full h-full object-cover"
            />
          </button>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>

        {rightContent}
      </div>
    </header>
  );
}

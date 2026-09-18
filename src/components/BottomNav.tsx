import { NavLink } from 'react-router-dom';
import { useT, type TranslationKey } from '../i18n';

const TABS: Array<{ to: string; key: TranslationKey; icon: string }> = [
  { to: '/', key: 'nav.pantry', icon: '🧺' },
  { to: '/suggestions', key: 'nav.suggestions', icon: '🍳' },
  { to: '/recipes', key: 'nav.recipes', icon: '📖' },
  { to: '/shopping', key: 'nav.shopping', icon: '🛒' },
  { to: '/log', key: 'nav.log', icon: '📔' },
  { to: '/settings', key: 'nav.settings', icon: '⚙️' },
];

export function BottomNav() {
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur" aria-label="Main">
      <ul className="mx-auto flex max-w-2xl justify-around">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                  isActive ? 'font-semibold text-emerald-700' : 'text-stone-500'
                }`
              }
            >
              <span aria-hidden="true" className="text-xl leading-none">
                {tab.icon}
              </span>
              {t(tab.key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

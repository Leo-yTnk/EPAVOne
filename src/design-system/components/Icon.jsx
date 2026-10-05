import {
  faHouse,
  faLightbulb,
  faCalendarDays,
  faPenToSquare,
  faSun,
  faMoon,
  faUser,
  faXmark,
  faFilter,
  faMagnifyingGlass,
  faPlus,
  faTrash,
  faShareNodes,
  faCopy,
  faArrowLeft,
  faArrowRight,
  faFloppyDisk,
  faUtensils,
  faBox,
  faTags,
  faGear,
  faFileImport,
  faRotate,
  faCheck,
  faEllipsis
} from '@fortawesome/free-solid-svg-icons';
const icons = {
  home: faHouse,
  insights: faLightbulb,
  planner: faCalendarDays,
  writer: faPenToSquare,
  sun: faSun,
  moon: faMoon,
  user: faUser,
  close: faXmark,
  filter: faFilter,
  search: faMagnifyingGlass,
  plus: faPlus,
  delete: faTrash,
  share: faShareNodes,
  copy: faCopy,
  back: faArrowLeft,
  next: faArrowRight,
  save: faFloppyDisk,
  recipe: faUtensils,
  product: faBox,
  category: faTags,
  settings: faGear,
  import: faFileImport,
  refresh: faRotate,
  check: faCheck,
  more: faEllipsis
};
export function Icon({ name, children, label, size = '1.125rem', ...props }) {
  const definition = icons[name]?.icon;
  return (
    <svg
      className="ds-icon"
      width={size}
      height={size}
      viewBox={definition ? `0 0 ${definition[0]} ${definition[1]}` : '0 0 24 24'}
      role={label ? 'img' : undefined}
      focusable="false"
      aria-hidden={label ? undefined : 'true'}
      aria-label={label}
      {...props}
    >
      {definition
        ? (Array.isArray(definition[4]) ? definition[4] : [definition[4]]).map((d, i) => <path key={i} fill="currentColor" d={d} />)
        : children}
    </svg>
  );
}

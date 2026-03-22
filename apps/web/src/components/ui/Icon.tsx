interface IconProps {
  name: string;
  className?: string;
  fill?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
}

/**
 * Material Symbols Outlined icon wrapper
 *
 * Usage:
 *   <Icon name="dashboard" />
 *   <Icon name="auto_awesome" fill className="text-primary" />
 *   <Icon name="lock" weight={600} className="text-2xl" />
 */
export default function Icon({ name, className = '', fill = false, weight = 400 }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

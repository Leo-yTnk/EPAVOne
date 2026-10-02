export function CardStitch({ contrast = false }) {
  return (
    <svg className="ds-stitch" aria-hidden="true" focusable="false">
      {contrast && <rect className="ds-stitch-underlay" x="1" y="1" />}
      <rect x="1" y="1" />
    </svg>
  );
}

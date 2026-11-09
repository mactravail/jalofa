import {
  bodyFigurePaths,
  type BodyFigureKind,
  type BodyFigureShape,
} from "@/lib/body-figure";

/** Une silhouette de face, dans la couleur du texte. Décorative : le nom est écrit dessous. */
export function BodyFigure({
  kind,
  shape,
  className,
}: {
  kind: BodyFigureKind;
  shape: BodyFigureShape;
  className?: string;
}) {
  const { head, paths } = bodyFigurePaths(kind, shape);
  return (
    <svg viewBox="0 0 100 190" fill="currentColor" aria-hidden className={className}>
      <ellipse cx={head.cx} cy={head.cy} rx={head.rx} ry={head.ry} />
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

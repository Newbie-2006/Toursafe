import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, src, size = 40, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-secondary-foreground font-semibold",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}

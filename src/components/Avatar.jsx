export default function Avatar({ name, photoURL, size = 40, className = "" }) {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        style={style}
        className={`rounded-full object-cover border-2 border-ink-700 ${className}`}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-blaze-gradient flex items-center justify-center font-heading font-medium text-white border-2 border-ink-700 ${className}`}
    >
      {initials}
    </div>
  );
}

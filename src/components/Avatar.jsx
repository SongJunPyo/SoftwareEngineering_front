export default function Avatar({ src, alt, size = 32, onClick }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid #fff',
        objectFit: 'cover',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    />
  );
}
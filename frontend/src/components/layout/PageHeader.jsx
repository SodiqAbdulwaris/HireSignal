export default function PageHeader({ title, subtitle }) {
  return (
    <div className="fade-up mb-8">
      <h1 className="mb-1 text-[1.875rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2.375rem]">
        {title}
      </h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

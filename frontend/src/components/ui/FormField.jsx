import { Children, cloneElement, isValidElement, useId } from "react";

export default function FormField({ label, children, hint }) {
  const generatedId = useId();
  const child = Children.toArray(children).find(isValidElement);
  const inputId = child?.props.id || generatedId;
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
          {hint && <span className="ml-1.5 font-normal text-muted-foreground/70">{hint}</span>}
        </label>
      )}
      {Children.map(children, (item) => isValidElement(item) && ["input", "select", "textarea"].includes(item.type)
        ? cloneElement(item, { id: inputId }) : item)}
    </div>
  );
}

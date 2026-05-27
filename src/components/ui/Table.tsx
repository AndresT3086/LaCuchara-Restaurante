import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ children, className = "", ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-cafe/15">
      <table
        className={["w-full text-sm font-body border-collapse", className].join(" ")}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={["bg-cafe/5", className].join(" ")} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={["divide-y divide-cafe/10", className].join(" ")} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={["hover:bg-cafe/5 transition-colors", className].join(" ")}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Th({ children, className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={[
        "px-4 py-3 text-left text-xs font-semibold text-cafe/60 uppercase tracking-wide font-heading",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={["px-4 py-3 text-cafe", className].join(" ")} {...props}>
      {children}
    </td>
  );
}

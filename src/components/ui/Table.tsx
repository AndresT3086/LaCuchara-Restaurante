import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ children, className = "", ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
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
    <thead className={["bg-maiz", className].join(" ")} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={["divide-y divide-maiz-3", className].join(" ")} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={["hover:bg-maiz transition-colors", className].join(" ")}
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
        "px-4 py-3 text-left text-[10px] font-bold text-cafe-3 uppercase tracking-[0.12em] font-body",
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
    <td className={["px-4 py-3.5 text-[13px] text-cafe", className].join(" ")} {...props}>
      {children}
    </td>
  );
}

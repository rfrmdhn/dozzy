import type { ReactNode, TableHTMLAttributes, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
// React is automated, just types needed
interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
    children: ReactNode;
    containerClassName?: string;
}

export function Table({ children, className = '', containerClassName = '', ...props }: TableProps) {
    return (
        <div className={`table-container ${containerClassName}`}>
            <table className={`table ${className}`} {...props}>
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return <thead {...props}>{children}</thead>;
}

export function TableBody({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody {...props}>{children}</tbody>;
}

export function TableRow({ children, className = '', ...props }: HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={className} {...props}>{children}</tr>;
}

export function TableHead({ children, className = '', ...props }: ThHTMLAttributes<HTMLTableHeaderCellElement>) {
    return <th className={className} {...props}>{children}</th>;
}

export function TableCell({ children, className = '', ...props }: TdHTMLAttributes<HTMLTableDataCellElement>) {
    return <td className={className} {...props}>{children}</td>;
}

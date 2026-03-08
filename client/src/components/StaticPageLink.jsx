import { Link } from "react-router-dom";

export default function StaticPageLink({ to, className, children }) {
  return (
    <Link to={to} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </Link>
  );
}

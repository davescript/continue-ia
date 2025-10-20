import clsx from 'clsx';

const Button = ({ variant = 'primary', icon: Icon, children, className, ...props }) => (
  <button
    type="button"
    className={clsx('button', variant === 'ghost' && 'button--ghost', className)}
    {...props}
  >
    {children}
    {Icon ? <Icon size={18} /> : null}
  </button>
);

export default Button;

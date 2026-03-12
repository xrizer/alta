import { ReactNode } from 'react';
import { CiCircleCheck, CiCircleRemove } from 'react-icons/ci';

const iconList: { [key: string]: ReactNode } = {
  success: <CiCircleCheck className="text-3xl text-white" />,
  error: <CiCircleRemove className="text-3xl text-white" />,
};

interface PropTypes {
  type: string;
  message: string;
}

const Toaster = (props: PropTypes) => {
  const { type, message } = props;
  return (
    <div
      role="alert"
      aria-labelledby="toaster-label"
      className={`$ fixed right-8 top-8 z-50 max-w-xs rounded-xl border border-gray-200 text-white ${type === 'success' ? 'bg-success' : 'bg-error'} shadow-sm`}>
      <div className="flex items-center gap-2 p-4">
        {iconList[type]}
        <p id="toaster-label" className="text-sm text-white">
          {message}
        </p>
      </div>
    </div>
  );
};

export default Toaster;

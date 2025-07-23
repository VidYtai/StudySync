import React from 'react';

interface EmptyStateProps {
  image: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ image, title, description, children }) => {
  return (
    <div className="text-center py-12 glass-pane px-6 animate-fade-in">
      <img src={image} alt="" className="mx-auto h-40 w-auto mb-6" />
      <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
      <p className="text-text-secondary mt-2 max-w-sm mx-auto">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default EmptyState;

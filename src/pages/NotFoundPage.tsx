import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Common/Button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6">
        <h1 className="text-8xl font-bold text-primary">404</h1>
        <div className="mt-2 h-1 w-16 rounded-full bg-primary mx-auto" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-foreground">Page not found</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved or
        deleted.
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Go back
        </Button>
        <Link to="/chat">
          <Button variant="primary" leftIcon={<Home className="h-4 w-4" />}>
            Go to chat
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

import { Link } from 'react-router-dom'

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="text-center">
      <h1 className="mb-2 text-6xl font-heading font-bold text-glow-cyan">404</h1>
      <p className="mb-6 text-muted-foreground">Even Fogg's maps don't go here.</p>
      <Link to="/" className="text-primary underline hover:text-primary/80">
        Back to London
      </Link>
    </div>
  </div>
)

export default NotFound

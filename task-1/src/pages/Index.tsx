import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    // Redirect to the Sokoban game
    window.location.href = "/sokoban/index.html";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Loading Sokoban...</h1>
        <p className="text-xl text-muted-foreground">Redirecting to game...</p>
      </div>
    </div>
  );
};

export default Index;

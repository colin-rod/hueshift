export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HueShift
            </h1>
            <p className="text-sm text-muted-foreground">
              Parse, visualize, and replace colors instantly
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="hidden md:block">v1.0 MVP</span>
          </div>
        </div>
      </div>
    </header>
  );
}

import LoginForm from "@/components/LoginForm";




export default function Home() {
  return (
    <main
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-slate-50
        px-4
        py-8
        transition-colors
        dark:bg-slate-950
      "
    >
      <LoginForm />
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewPostRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/posts");
  }, [router]);

  return <div>Yönlendiriliyor...</div>;
} 
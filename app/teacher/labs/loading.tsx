import { Sidebar } from "@/components/sidebar"

export default function Loading() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="teacher" />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-unab-red"></div>
        <span className="ml-2 text-gray-600">Cargando laboratorios...</span>
      </div>
    </div>
  )
}

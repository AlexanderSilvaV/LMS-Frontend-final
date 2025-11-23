import { PostComponent } from '@/components/foros/post-component'
import { PostDTO } from '@/app/lib/types/foro-types'

interface XSSResultDisplayProps {
  post: PostDTO | null
}

export function XSSResultDisplay({ post }: XSSResultDisplayProps) {
  if (!post) return null

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Resultado - Post Renderizado:</h3>
      <div className="border rounded-lg p-4 bg-gray-50">
        <PostComponent
          post={post}
          canEdit={false}
        />
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Si ves una alerta de JavaScript, el XSS funcionó. Si no, está sanitizado.
      </p>
    </div>
  )
}
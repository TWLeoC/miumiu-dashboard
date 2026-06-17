import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CategoriesPage() {
  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">分類管理</h1>
      <Card>
        <CardHeader><CardTitle>商品分類</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">開發中...</p>
        </CardContent>
      </Card>
    </div>
  )
}

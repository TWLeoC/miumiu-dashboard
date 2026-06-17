import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-lg font-bold text-gray-900 mb-6">使用者管理</h1>
      <Card>
        <CardHeader><CardTitle>顧客列表</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">開發中...</p>
        </CardContent>
      </Card>
    </div>
  )
}

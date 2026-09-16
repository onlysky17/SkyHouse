export type RemoteProduct = {
  id: number
  name: string
  price: number | null
  unit: string
  category: string
  description: string
  image_url: string
  in_stock: boolean
  visible: boolean
  sort_order: number
}

export function mergeRemoteProduct<T extends {
  id:number
  name:string
  price:number|null
  unit?:string
  category:string
  desc:string
  stock:boolean
  image:string
  visible?:boolean
}>(base:T, remote:RemoteProduct):T {
  return {
    ...base,
    name: remote.name || base.name,
    price: remote.price,
    unit: remote.unit || base.unit,
    category: remote.category || base.category,
    desc: remote.description || base.desc,
    image: remote.image_url || base.image,
    stock: remote.in_stock,
    visible: remote.visible,
  }
}

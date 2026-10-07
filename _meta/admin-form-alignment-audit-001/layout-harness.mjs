// Source-derived blank controls only: no auth, records, RPC or submission handlers.
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
const root = process.cwd()
const read = file => fs.readFileSync(path.join(root, 'src', file), 'utf8')
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
function find(node, predicate) {
  if (predicate(node)) return node
  let found
  ts.forEachChild(node, child => { if (!found) found = find(child, predicate) })
  return found
}
function className(node) {
  const attr = node.openingElement?.attributes.properties.find(item => item.name?.getText() === 'className')
  return attr?.initializer && ts.isStringLiteral(attr.initializer) ? attr.initializer.text : null
}
function render(node) {
  if (ts.isJsxText(node)) return escape(node.text.replace(/\s+/g, ' ').trim())
  if (ts.isJsxExpression(node)) {
    const expr = node.expression
    if (!expr) return ''
    if (ts.isStringLiteral(expr)) return escape(expr.text)
    if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return render(expr.right)
    if (ts.isConditionalExpression(expr)) return render(ts.factory.createJsxExpression(undefined, expr.whenFalse))
    return ''
  }
  if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node)) return ''
  const opening = node.openingElement || node
  const tag = opening.tagName.getText()
  const attrs = opening.attributes.properties.flatMap(attr => {
    const name = attr.name?.getText()
    if (!name || name.startsWith('on') || ['ref', 'value', 'checked'].includes(name)) return []
    if (!attr.initializer) return [name]
    if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression && ts.isNumericLiteral(attr.initializer.expression)) return [`${name}="${attr.initializer.expression.text}"`]
    if (!ts.isStringLiteral(attr.initializer)) return []
    return [`${name === 'className' ? 'class' : name}="${escape(attr.initializer.text)}"`]
  }).join(' ')
  const start = `<${tag}${attrs ? ` ${attrs}` : ''}>`
  return ['input', 'img', 'br'].includes(tag) ? start : start + (node.children || []).map(render).join('') + `</${tag}>`
}
function jsx(file, name) {
  const ast = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const element = find(ast, node => ts.isJsxElement(node) && className(node) === name)
  if (!element) throw new Error(`Missing source form: ${file} ${name}`)
  return render(element)
}
function injected(file, name) {
  const text = read(file)
  const start = text.indexOf(`<div class="${name}">`)
  if (start < 0) throw new Error(`Missing injected form: ${name}`)
  const html = text.slice(start, text.indexOf('</div>', start) + 6)
  let output = ''
  for (let i = 0; i < html.length; i++) {
    if (html.slice(i, i + 2) !== '${') { output += html[i]; continue }
    let depth = 1
    i += 2
    for (; i < html.length && depth; i++) { if (html[i] === '{') depth++; if (html[i] === '}') depth-- }
    i--
  }
  return output
}
let product = jsx('Admin.tsx', 'adminFormGrid')
const compare = read('sale-pricing.ts').match(/field\.innerHTML = '([^']+)'/)[1]
const hint = read('sale-pricing.ts').match(/setStatus\(status, '(Sản phẩm mới:[^']+)'/)[1]
const newCompare = compare.replace('<input ', '<input disabled ').replace(/(<small[^>]*>).*?(<\/small>)/, `$1${hint}$2`)
const end = product.indexOf('</label>', product.indexOf('Giá<input')) + 8
product = product.slice(0, end) + `<label class="saleCompareField">${newCompare}</label>` + product.slice(end)
const names = [...read('main.tsx').matchAll(/import '\.\/([^']+\.css)'/g)].map(match => match[1])
const base = names.filter(name => name !== 'form-alignment.css').map(read).join('\n')
const fix = '<style>' + read('form-alignment.css') + '</style>'
const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SkyHouse — Source form alignment audit</title><style>${base}</style>
<style>body{margin:0;background:#f5ecdf;color:#24160f}.audit{max-width:1100px;margin:auto;padding:20px}.audit>header{padding-bottom:18px}.audit h2{font-size:24px}.audit section{margin:20px 0}.audit .adminEditor{width:100%}.audit .cartCustomerInfo{max-width:510px}.audit .adminLogin{margin:0}.audit header a{display:inline-block;margin-right:16px;text-decoration:underline}</style>
<script>if(!new URLSearchParams(location.search).has('before'))document.write(${JSON.stringify(fix)})</script>
<main class="audit"><header><h1>Form alignment — source-derived blank controls</h1><p>Layout harness only. No admin session, records, RPC or submission handlers.</p><a href="?before">Before</a><a href="?">After</a></header>
<section><h2>Admin Product — new product helper</h2><form class="adminEditor">${product}</form></section>
<section class="adminOrderSettlement"><h2>Admin Orders — settlement</h2>${injected('admin-orders.ts', 'adminOrderSettlementGrid')}</section>
<section class="cartCustomerInfo"><h2>Cart — customer information</h2>${injected('cart-customer-info.ts', 'cartCustomerGrid')}</section>
<section><h2>Tracking</h2>${jsx('TrackOrder.tsx', 'trackForm')}</section>
<section><h2>Login</h2>${jsx('Admin.tsx', 'adminLogin')}</section></main>
<script>document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));document.querySelectorAll('button').forEach(button=>button.type='button')</script></html>`
fs.writeFileSync(path.join(root, '_meta/admin-form-alignment-audit-001/layout-harness.html'), html)
console.log('Created source-derived layout-harness.html without data or network handlers.')

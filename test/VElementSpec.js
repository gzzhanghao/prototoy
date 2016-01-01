import VElement from '../src/VElement'

let e = VElement.e

describe('VElement', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = '<span></span>'
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  function createDOM(opts) {
    return new VElement(opts).replace(container.firstChild).update()
  }

  it('can append to an element', () => {
    new VElement(e('div')).appendTo(container)
    expect(container.lastChild).toEqual(jasmine.any(HTMLDivElement))
  })

  it('can insert before an element', () => {
    new VElement(e('div')).insertBefore(container.firstChild)
    expect(container.firstChild).toEqual(jasmine.any(HTMLDivElement))
  })

  it('can replace an element', () => {
    new VElement(e('div')).replace(container.firstChild)
    expect(container.firstChild).toEqual(jasmine.any(HTMLDivElement))
    expect(container.children.length).toEqual(1)
  })

  it('can create an element with namespace', () => {
    createDOM(e('svg', null, 'http://www.w3.org/2000/svg'))
    expect(container.firstChild).toEqual(jasmine.any(SVGElement))
    expect(container.firstChild.namespaceURI).toEqual('http://www.w3.org/2000/svg')
  })

  it('can create an element with layout', () => {
    createDOM(e('div', { top: 1, left: 2, width: 3, height: 4 }))
    let style = container.firstChild.style
    expect(style.transform).toEqual('translate(2px, 1px)')
    expect(style.width).toEqual('3px')
    expect(style.height).toEqual('4px')
  })

  it('can create an element with dynamic layout', () => {
    let width = 1
    let virtual = createDOM(e('div', { width: () => width }))
    let style = container.firstChild.style
    expect(style.width).toEqual('1px')
    width = 2
    virtual.update()
    expect(style.width).toEqual('2px')
  })

  it('can update opts with update method', () => {
    let virtual = createDOM(e('div', { width: 1 }))
    let style = container.firstChild.style
    expect(style.width).toEqual('1px')
    virtual.update(e('div', { width: 2 }))
    expect(style.width).toEqual('2px')
  })

  it('can create an element with properties', () => {
    let virtual = createDOM(e('div', $ => ({ prop: { innerText: 'hello' } })))
    expect(container.firstChild.textContent).toEqual('hello')
    virtual.update(e('div', $ => ({ prop: { innerHTML: '<b>world</b>' } })))
    expect(container.firstChild.innerHTML).toEqual('<b>world</b>')
  })

  it('can create an element with style', () => {
    let virtual = createDOM(e('div', $ => ({ backgroundColor: 'red' })))
    expect(container.firstChild.style.backgroundColor).toEqual('red')
    virtual.update(e('div'))
    expect(container.firstChild.style.backgroundColor).toEqual('')
  })

  it('can remove properties', () => {
    let virtual = createDOM(e('div', { prop: { innerText: 'hello' } }))
    virtual.update(e('div'))
    expect(container.firstChild.innerText).toEqual('')
  })

  it('can create element with element children', () => {
    let virtual = createDOM(
      e('div', [e('span')])
    )
    expect(container.firstChild.children.length).toEqual(1)
    expect(container.firstChild.children[0]).toEqual(jasmine.any(HTMLSpanElement))
  })

  it('can create element with dynamic children', () => {
    let virtual = createDOM(e('div', [[]]))
    expect(container.firstChild.children.length).toEqual(0)
    virtual.update(
      e('div', [
        [e('span')]
      ])
    )
    expect(container.firstChild.children.length).toEqual(1)
    expect(container.firstChild.children[0]).toEqual(jasmine.any(HTMLSpanElement))
  })

  it('can create element with children from functions', () => {
    let elements = []
    let virtual = createDOM(
      e('div', [
        () => elements.map(element => e('span'))
      ])
    )
    expect(container.firstChild.children.length).toEqual(0)
    elements = [1, 2]
    virtual.update()
    expect(container.firstChild.children.length).toEqual(2)
    expect(container.firstChild.children[0]).toEqual(jasmine.any(HTMLSpanElement))
    expect(container.firstChild.children[1]).toEqual(jasmine.any(HTMLSpanElement))
  })

  it('can update children with update', () => {
    let virtual = createDOM(e('div', [[]]))
    expect(container.firstChild.children.length).toEqual(0)
    virtual.update(e('div', [[e('span')]]))
    expect(container.firstChild.children.length).toEqual(1)
    expect(container.firstChild.children[0]).toEqual(jasmine.any(HTMLSpanElement))
  })

  it('can get layout of the element', () => {
    createDOM(
      e('div', { top: 1, width: $ => $.top() + 1 }, $ => ({ prop: { innerText: $.top() } }))
    )
    expect(container.firstChild.innerText).toEqual('1')
    expect(container.firstChild.style.width).toEqual('2px')
  })

  it('can get layout of children', () => {
    createDOM(
      e('div', { top: 1, width: 2, height: $ => $.children[0].bottom() + 1 }, [
        e('span', { top: 1, height: 1 })
      ])
    )
    expect(container.firstChild.style.height).toEqual('3px')
  })

  it('can get layout of siblings', () => {
    createDOM(
      e('div', [
        e('span', { top: 1, height: $ => $.next.bottom() + 1 }),
        e('span', { top: $ => $.prev.top() + 1, height: 1 })
      ])
    )
    expect(container.firstChild.firstChild.style.height).toEqual('4px')
    expect(container.firstChild.lastChild.style.transform).toEqual('translate(0px, 2px)')
  })

  it('can get visibility of element', () => {
    let visible = false
    let virtual = createDOM(
      e('div', { visible: () => visible }, [
        e('div', $ => ({ prop: { innerText: $.visible() } }))
      ])
    )
    expect(container.firstChild.firstChild.innerText).toEqual('false')
    visible = true
    virtual.update()
    expect(container.firstChild.firstChild.innerText).toEqual('true')
  })

  describe('layout', () => {

    it('can change automatically with visibility', () => {
      createDOM(
        e('div', { visible: false }, [
          e('div', { top: 1 }, $ => ({ prop: { innerText: $.top() }}))
        ])
      )
      expect(container.firstChild.firstChild.innerText).toEqual('0')
    })

    it('can get from BCR when not set', () => {
      createDOM(
        e('div', [
          e('div', $ => ({ prop: { innerText: 'foo' } })),
          e('div', $ => ({ prop: { innerText: $.prev.height() }}))
        ])
      )
      expect(container.firstChild.lastChild.innerText).toBeGreaterThan(0)
    })

    it('can get BCR right after update', () => {
      let content = ''
      let virtual = createDOM(
        e('div', [
          e('div', $ => ({ prop: { innerText: content } })),
          e('div', $ => ({ prop: { innerText: $.prev.height() }}))
        ])
      )
      expect(container.firstChild.lastChild.innerText).toEqual('0')
      content = 'foo'
      virtual.update()
      expect(container.firstChild.lastChild.innerText).toBeGreaterThan(0)
    })
  })
})

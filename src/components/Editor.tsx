import * as ace from 'brace'
import * as React from 'react'

export function Editor(props: { editable: boolean; content: string; onChange: (text: string) => void }) {
    const ref = React.useRef<HTMLDivElement>()
    const [editor, setEditor] = React.useState<ace.Editor>()

    React.useEffect(() => {
        if (!ref.current) return
        const editor = ace.edit(ref.current)
        setEditor(editor)
        editor.setFontSize('1rem')
        editor.$blockScrolling = Infinity

        const size = { width: ref.current.clientWidth, height: ref.current.clientHeight }

        const interval = window.setInterval(() => {
            if (size.width === ref.current.clientWidth && size.height === ref.current.clientHeight) return
            size.width = ref.current.clientWidth
            size.height = ref.current.clientHeight
            editor.resize()
        }, 500)

        return () => window.clearInterval(interval)
    }, [ref])

    React.useEffect(() => {
        if (!editor) return
        editor.setReadOnly(!props.editable)
        editor.session.doc.setValue(props.content)

        const blurFunction = () => props.onChange(editor.session.doc.getValue())
        editor.on('blur', blurFunction)
        return () => editor.off('blur', blurFunction)
    }, [editor, props.editable, props.content, props.onChange])

    return <div ref={ref} className='d-flex w-100 h-100' />
}

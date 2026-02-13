import { editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { slashFactory, SlashProvider } from '@milkdown/kit/plugin/slash';
import type { EditorView } from '@milkdown/kit/prose/view';
import type { EditorState } from '@milkdown/kit/prose/state';

interface Suggestion {
    name: string;
    url: string;
}

export const slash = slashFactory('Commands');

const MAX_LOOKBACK = 80;

export function createSlashView(ctx: Ctx, suggestions: Suggestion[]) {
    return (_view: EditorView) => {
        let searching = false;
        let filter = '';

        // Create the dropdown container
        const container = document.createElement('div');
        container.className = "absolute z-50 min-w-50 bg-white border border-slate-200 rounded-lg shadow-xl p-1 flex flex-col gap-1 data-[show='false']:hidden";

        function render() {
            container.innerHTML = '';
            const filtered = suggestions.filter(item =>
                item.name.toLowerCase().includes(filter.toLowerCase())
            );

            if (filtered.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'px-3 py-2 text-slate-400 text-sm';
                empty.textContent = 'No links found...';
                container.appendChild(empty);
                return;
            }

            filtered.forEach(link => {
                const btn = document.createElement('button');
                btn.className = 'flex flex-col text-left px-3 py-2 rounded hover:bg-slate-100 transition-colors';
                btn.innerHTML = `
                    <span class="font-medium text-slate-900">${link.name}</span>
                    <span class="text-xs text-slate-400 truncate max-w-45">${link.url}</span>
                `;
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    insertLink(link.name, link.url);
                });
                container.appendChild(btn);
            });
        }

        function insertLink(name: string, url: string) {
            const view = ctx.get(editorViewCtx);
            const { dispatch, state } = view;
            const { tr, selection } = state;
            const { from } = selection;
            const deleteFrom = from - (filter.length + 1);

            const transaction = tr.insertText(`[${name}](${url}) `, deleteFrom, from);
            dispatch(transaction);

            requestAnimationFrame(() => view.focus());
        }

        function shouldShow(view: EditorView): boolean {
            console.log('Checking slash menu visibility...', { searching, filter });
            const { from } = view.state.selection;
            const lastChar = from > 0 ? view.state.doc.textBetween(from - 1, from, '\n') : '';

            if (lastChar === '@' && !searching) {
                console.log('Slash menu triggered');
                searching = true;
                filter = '';
                return true;
            }

            const lookFrom = Math.max(0, from - MAX_LOOKBACK);
            const searchText = view.state.doc.textBetween(lookFrom, from, '\n');
            const match = /@([^@\n]*)$/.exec(searchText);

            if (match && searching) {
                filter = match[1] || '';
                return true;
            }

            searching = false;
            return false;
        }

        // Set up SlashProvider for positioning
        const slashProvider = new SlashProvider({
            content: container,
            shouldShow,
        });

        // Listen for Escape key
        _view.dom.addEventListener('keyup', (e) => {
            if (e.key === 'Escape' && searching) {
                e.preventDefault();
                e.stopPropagation();
                slashProvider.hide();
                filter = '';
                searching = false;
            }
        });

        return {
            update(view: EditorView, prevState?: EditorState) {
                console.log('Rendering slash menu...', { searching, filter });
                render();
                slashProvider.update(view, prevState);
            },
            destroy() {
                slashProvider.destroy();
                container.remove();
            },
        };
    };
}


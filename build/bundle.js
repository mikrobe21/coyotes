
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/ContactCard.svelte generated by Svelte v3.44.1 */

    const file$1 = "src/ContactCard.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let header;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h1;
    	let t1;
    	let t2;
    	let t3;
    	let h2;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t9;
    	let th1;
    	let t11;
    	let th2;
    	let t13;
    	let tbody;
    	let tr1;
    	let td0;
    	let t15;
    	let td1;
    	let t16_value = (/*total*/ ctx[4] / 4 * 1.062937063).toFixed() + "";
    	let t16;
    	let t17;
    	let td2;
    	let t19;
    	let tr2;
    	let td3;
    	let t21;
    	let td4;
    	let t22_value = (/*total*/ ctx[4] * (3 / 8) * 1.081585082).toFixed() + "";
    	let t22;
    	let t23;
    	let td5;
    	let t25;
    	let tr3;
    	let td6;
    	let t27;
    	let td7;
    	let t28_value = (/*total*/ ctx[4] / 2 * 1.132867133).toFixed() + "";
    	let t28;
    	let t29;
    	let td8;
    	let t30_value = (/*total*/ ctx[4] / 2 * 1.132867133).toFixed() + "";
    	let t30;
    	let t31;
    	let tr4;
    	let td9;
    	let t33;
    	let td10;
    	let t34_value = (/*total*/ ctx[4] * 1.202797203).toFixed() + "";
    	let t34;
    	let t35;
    	let td11;
    	let t36_value = (/*total*/ ctx[4] * 1.202797203 / 2).toFixed() + "";
    	let t36;
    	let t37;
    	let tr5;
    	let td12;
    	let t39;
    	let td13;
    	let t40_value = (/*total*/ ctx[4] * 1.5 * 1.244755245).toFixed() + "";
    	let t40;
    	let t41;
    	let td14;
    	let t42_value = (/*total*/ ctx[4] * 1.5 * 1.244755245 / 3).toFixed() + "";
    	let t42;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			header = element("header");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			t1 = text("User Name: ");
    			t2 = text(/*userName*/ ctx[2]);
    			t3 = space();
    			h2 = element("h2");
    			t4 = text("Time trial time: ");
    			t5 = text(/*userMinutes*/ ctx[1]);
    			t6 = text(":");
    			t7 = text(/*userSeconds*/ ctx[0]);
    			t8 = space();
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			t9 = space();
    			th1 = element("th");
    			th1.textContent = "goal time";
    			t11 = space();
    			th2 = element("th");
    			th2.textContent = "goal pace per 400m";
    			t13 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "200m";
    			t15 = space();
    			td1 = element("td");
    			t16 = text(t16_value);
    			t17 = space();
    			td2 = element("td");
    			td2.textContent = "n/a";
    			t19 = space();
    			tr2 = element("tr");
    			td3 = element("td");
    			td3.textContent = "300m";
    			t21 = space();
    			td4 = element("td");
    			t22 = text(t22_value);
    			t23 = space();
    			td5 = element("td");
    			td5.textContent = "n/a";
    			t25 = space();
    			tr3 = element("tr");
    			td6 = element("td");
    			td6.textContent = "400m";
    			t27 = space();
    			td7 = element("td");
    			t28 = text(t28_value);
    			t29 = space();
    			td8 = element("td");
    			t30 = text(t30_value);
    			t31 = space();
    			tr4 = element("tr");
    			td9 = element("td");
    			td9.textContent = "800m";
    			t33 = space();
    			td10 = element("td");
    			t34 = text(t34_value);
    			t35 = space();
    			td11 = element("td");
    			t36 = text(t36_value);
    			t37 = space();
    			tr5 = element("tr");
    			td12 = element("td");
    			td12.textContent = "1200m";
    			t39 = space();
    			td13 = element("td");
    			t40 = text(t40_value);
    			t41 = space();
    			td14 = element("td");
    			t42 = text(t42_value);
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-dw5eg8");
    			add_location(img, file$1, 70, 8, 1378);
    			attr_dev(div0, "class", "thumb svelte-dw5eg8");
    			add_location(div0, file$1, 69, 6, 1350);
    			attr_dev(h1, "class", "svelte-dw5eg8");
    			add_location(h1, file$1, 73, 8, 1458);
    			attr_dev(h2, "class", "svelte-dw5eg8");
    			add_location(h2, file$1, 74, 8, 1497);
    			attr_dev(th0, "class", "svelte-dw5eg8");
    			add_location(th0, file$1, 79, 6, 1605);
    			attr_dev(th1, "class", "svelte-dw5eg8");
    			add_location(th1, file$1, 80, 6, 1621);
    			attr_dev(th2, "class", "svelte-dw5eg8");
    			add_location(th2, file$1, 81, 6, 1646);
    			add_location(tr0, file$1, 78, 4, 1594);
    			add_location(thead, file$1, 77, 2, 1582);
    			attr_dev(td0, "class", "svelte-dw5eg8");
    			add_location(td0, file$1, 86, 6, 1720);
    			attr_dev(td1, "class", "svelte-dw5eg8");
    			add_location(td1, file$1, 87, 6, 1740);
    			attr_dev(td2, "class", "svelte-dw5eg8");
    			add_location(td2, file$1, 88, 6, 1791);
    			add_location(tr1, file$1, 85, 4, 1709);
    			attr_dev(td3, "class", "svelte-dw5eg8");
    			add_location(td3, file$1, 91, 6, 1829);
    			attr_dev(td4, "class", "svelte-dw5eg8");
    			add_location(td4, file$1, 92, 6, 1849);
    			attr_dev(td5, "class", "svelte-dw5eg8");
    			add_location(td5, file$1, 93, 6, 1904);
    			add_location(tr2, file$1, 90, 4, 1818);
    			attr_dev(td6, "class", "svelte-dw5eg8");
    			add_location(td6, file$1, 96, 6, 1942);
    			attr_dev(td7, "class", "svelte-dw5eg8");
    			add_location(td7, file$1, 97, 6, 1962);
    			attr_dev(td8, "class", "svelte-dw5eg8");
    			add_location(td8, file$1, 98, 6, 2013);
    			add_location(tr3, file$1, 95, 4, 1931);
    			attr_dev(td9, "class", "svelte-dw5eg8");
    			add_location(td9, file$1, 101, 6, 2083);
    			attr_dev(td10, "class", "svelte-dw5eg8");
    			add_location(td10, file$1, 102, 6, 2103);
    			attr_dev(td11, "class", "svelte-dw5eg8");
    			add_location(td11, file$1, 103, 6, 2150);
    			add_location(tr4, file$1, 100, 4, 2072);
    			attr_dev(td12, "class", "svelte-dw5eg8");
    			add_location(td12, file$1, 106, 6, 2222);
    			attr_dev(td13, "class", "svelte-dw5eg8");
    			add_location(td13, file$1, 107, 6, 2243);
    			attr_dev(td14, "class", "svelte-dw5eg8");
    			add_location(td14, file$1, 108, 6, 2294);
    			add_location(tr5, file$1, 105, 4, 2211);
    			add_location(tbody, file$1, 84, 2, 1697);
    			attr_dev(table, "class", "svelte-dw5eg8");
    			add_location(table, file$1, 76, 0, 1572);
    			attr_dev(div1, "class", "user-data svelte-dw5eg8");
    			add_location(div1, file$1, 72, 6, 1426);
    			attr_dev(header, "class", "svelte-dw5eg8");
    			add_location(header, file$1, 68, 4, 1335);
    			attr_dev(div2, "class", "contact-card svelte-dw5eg8");
    			add_location(div2, file$1, 67, 2, 1304);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, header);
    			append_dev(header, div0);
    			append_dev(div0, img);
    			append_dev(header, t0);
    			append_dev(header, div1);
    			append_dev(div1, h1);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, h2);
    			append_dev(h2, t4);
    			append_dev(h2, t5);
    			append_dev(h2, t6);
    			append_dev(h2, t7);
    			append_dev(div1, t8);
    			append_dev(div1, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t9);
    			append_dev(tr0, th1);
    			append_dev(tr0, t11);
    			append_dev(tr0, th2);
    			append_dev(table, t13);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t15);
    			append_dev(tr1, td1);
    			append_dev(td1, t16);
    			append_dev(tr1, t17);
    			append_dev(tr1, td2);
    			append_dev(tbody, t19);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td3);
    			append_dev(tr2, t21);
    			append_dev(tr2, td4);
    			append_dev(td4, t22);
    			append_dev(tr2, t23);
    			append_dev(tr2, td5);
    			append_dev(tbody, t25);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td6);
    			append_dev(tr3, t27);
    			append_dev(tr3, td7);
    			append_dev(td7, t28);
    			append_dev(tr3, t29);
    			append_dev(tr3, td8);
    			append_dev(td8, t30);
    			append_dev(tbody, t31);
    			append_dev(tbody, tr4);
    			append_dev(tr4, td9);
    			append_dev(tr4, t33);
    			append_dev(tr4, td10);
    			append_dev(td10, t34);
    			append_dev(tr4, t35);
    			append_dev(tr4, td11);
    			append_dev(td11, t36);
    			append_dev(tbody, t37);
    			append_dev(tbody, tr5);
    			append_dev(tr5, td12);
    			append_dev(tr5, t39);
    			append_dev(tr5, td13);
    			append_dev(td13, t40);
    			append_dev(tr5, t41);
    			append_dev(tr5, td14);
    			append_dev(td14, t42);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*image*/ 8 && !src_url_equal(img.src, img_src_value = /*image*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*userName*/ 4) set_data_dev(t2, /*userName*/ ctx[2]);
    			if (dirty & /*userMinutes*/ 2) set_data_dev(t5, /*userMinutes*/ ctx[1]);
    			if (dirty & /*userSeconds*/ 1) set_data_dev(t7, /*userSeconds*/ ctx[0]);
    			if (dirty & /*total*/ 16 && t16_value !== (t16_value = (/*total*/ ctx[4] / 4 * 1.062937063).toFixed() + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*total*/ 16 && t22_value !== (t22_value = (/*total*/ ctx[4] * (3 / 8) * 1.081585082).toFixed() + "")) set_data_dev(t22, t22_value);
    			if (dirty & /*total*/ 16 && t28_value !== (t28_value = (/*total*/ ctx[4] / 2 * 1.132867133).toFixed() + "")) set_data_dev(t28, t28_value);
    			if (dirty & /*total*/ 16 && t30_value !== (t30_value = (/*total*/ ctx[4] / 2 * 1.132867133).toFixed() + "")) set_data_dev(t30, t30_value);
    			if (dirty & /*total*/ 16 && t34_value !== (t34_value = (/*total*/ ctx[4] * 1.202797203).toFixed() + "")) set_data_dev(t34, t34_value);
    			if (dirty & /*total*/ 16 && t36_value !== (t36_value = (/*total*/ ctx[4] * 1.202797203 / 2).toFixed() + "")) set_data_dev(t36, t36_value);
    			if (dirty & /*total*/ 16 && t40_value !== (t40_value = (/*total*/ ctx[4] * 1.5 * 1.244755245).toFixed() + "")) set_data_dev(t40, t40_value);
    			if (dirty & /*total*/ 16 && t42_value !== (t42_value = (/*total*/ ctx[4] * 1.5 * 1.244755245 / 3).toFixed() + "")) set_data_dev(t42, t42_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let total;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ContactCard', slots, []);
    	let { userSeconds } = $$props;
    	let { userMinutes } = $$props;
    	let { userName } = $$props;
    	let { image = "https://image.shutterstock.com/image-vector/graphical-tortoise-isolated-on-white-260nw-1174459756.jpg" } = $$props;
    	const writable_props = ['userSeconds', 'userMinutes', 'userName', 'image'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ContactCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('userSeconds' in $$props) $$invalidate(0, userSeconds = $$props.userSeconds);
    		if ('userMinutes' in $$props) $$invalidate(1, userMinutes = $$props.userMinutes);
    		if ('userName' in $$props) $$invalidate(2, userName = $$props.userName);
    		if ('image' in $$props) $$invalidate(3, image = $$props.image);
    	};

    	$$self.$capture_state = () => ({
    		userSeconds,
    		userMinutes,
    		userName,
    		image,
    		total
    	});

    	$$self.$inject_state = $$props => {
    		if ('userSeconds' in $$props) $$invalidate(0, userSeconds = $$props.userSeconds);
    		if ('userMinutes' in $$props) $$invalidate(1, userMinutes = $$props.userMinutes);
    		if ('userName' in $$props) $$invalidate(2, userName = $$props.userName);
    		if ('image' in $$props) $$invalidate(3, image = $$props.image);
    		if ('total' in $$props) $$invalidate(4, total = $$props.total);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*userMinutes, userSeconds*/ 3) {
    			$$invalidate(4, total = parseInt(userMinutes) * 60 + parseInt(userSeconds));
    		}
    	};

    	return [userSeconds, userMinutes, userName, image, total];
    }

    class ContactCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			userSeconds: 0,
    			userMinutes: 1,
    			userName: 2,
    			image: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContactCard",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*userSeconds*/ ctx[0] === undefined && !('userSeconds' in props)) {
    			console.warn("<ContactCard> was created without expected prop 'userSeconds'");
    		}

    		if (/*userMinutes*/ ctx[1] === undefined && !('userMinutes' in props)) {
    			console.warn("<ContactCard> was created without expected prop 'userMinutes'");
    		}

    		if (/*userName*/ ctx[2] === undefined && !('userName' in props)) {
    			console.warn("<ContactCard> was created without expected prop 'userName'");
    		}
    	}

    	get userSeconds() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userSeconds(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userMinutes() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userMinutes(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userName() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userName(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.1 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let contactcard0;
    	let t0;
    	let p;
    	let t2;
    	let input0;
    	let t3;
    	let input1;
    	let t4;
    	let contactcard1;
    	let t5;
    	let contactcard2;
    	let current;
    	let mounted;
    	let dispose;

    	contactcard0 = new ContactCard({
    			props: {
    				userMinutes: /*minutes*/ ctx[0],
    				userSeconds: /*seconds*/ ctx[1],
    				userName: "Example"
    			},
    			$$inline: true
    		});

    	contactcard1 = new ContactCard({
    			props: {
    				userMinutes: 3,
    				userSeconds: 10,
    				userName: "Lina",
    				image: /*image2*/ ctx[3]
    			},
    			$$inline: true
    		});

    	contactcard2 = new ContactCard({
    			props: {
    				userMinutes: 2,
    				userSeconds: 15,
    				userName: "Mike",
    				image: /*image1*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(contactcard0.$$.fragment);
    			t0 = space();
    			p = element("p");
    			p.textContent = "Enter your time:";
    			t2 = space();
    			input0 = element("input");
    			t3 = text("minutes\n");
    			input1 = element("input");
    			t4 = text("seconds\n\n\n");
    			create_component(contactcard1.$$.fragment);
    			t5 = space();
    			create_component(contactcard2.$$.fragment);
    			add_location(p, file, 11, 0, 405);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file, 12, 0, 429);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file, 13, 0, 482);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(contactcard0, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*minutes*/ ctx[0]);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*seconds*/ ctx[1]);
    			insert_dev(target, t4, anchor);
    			mount_component(contactcard1, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(contactcard2, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const contactcard0_changes = {};
    			if (dirty & /*minutes*/ 1) contactcard0_changes.userMinutes = /*minutes*/ ctx[0];
    			if (dirty & /*seconds*/ 2) contactcard0_changes.userSeconds = /*seconds*/ ctx[1];
    			contactcard0.$set(contactcard0_changes);

    			if (dirty & /*minutes*/ 1 && input0.value !== /*minutes*/ ctx[0]) {
    				set_input_value(input0, /*minutes*/ ctx[0]);
    			}

    			if (dirty & /*seconds*/ 2 && input1.value !== /*seconds*/ ctx[1]) {
    				set_input_value(input1, /*seconds*/ ctx[1]);
    			}

    			const contactcard1_changes = {};
    			if (dirty & /*image2*/ 8) contactcard1_changes.image = /*image2*/ ctx[3];
    			contactcard1.$set(contactcard1_changes);
    			const contactcard2_changes = {};
    			if (dirty & /*image1*/ 4) contactcard2_changes.image = /*image1*/ ctx[2];
    			contactcard2.$set(contactcard2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contactcard0.$$.fragment, local);
    			transition_in(contactcard1.$$.fragment, local);
    			transition_in(contactcard2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contactcard0.$$.fragment, local);
    			transition_out(contactcard1.$$.fragment, local);
    			transition_out(contactcard2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(contactcard0, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t4);
    			destroy_component(contactcard1, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(contactcard2, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { minutes = 3 } = $$props;
    	let { seconds = 30 } = $$props;
    	let { image1 = "https://media.istockphoto.com/illustrations/scary-chupacabra-illustration-id165767972?s=612x612" } = $$props;
    	let { image2 = "https://static.educalingo.com/img/en/800/african-elephant.jpg" } = $$props;
    	const writable_props = ['minutes', 'seconds', 'image1', 'image2'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		minutes = this.value;
    		$$invalidate(0, minutes);
    	}

    	function input1_input_handler() {
    		seconds = this.value;
    		$$invalidate(1, seconds);
    	}

    	$$self.$$set = $$props => {
    		if ('minutes' in $$props) $$invalidate(0, minutes = $$props.minutes);
    		if ('seconds' in $$props) $$invalidate(1, seconds = $$props.seconds);
    		if ('image1' in $$props) $$invalidate(2, image1 = $$props.image1);
    		if ('image2' in $$props) $$invalidate(3, image2 = $$props.image2);
    	};

    	$$self.$capture_state = () => ({
    		ContactCard,
    		minutes,
    		seconds,
    		image1,
    		image2
    	});

    	$$self.$inject_state = $$props => {
    		if ('minutes' in $$props) $$invalidate(0, minutes = $$props.minutes);
    		if ('seconds' in $$props) $$invalidate(1, seconds = $$props.seconds);
    		if ('image1' in $$props) $$invalidate(2, image1 = $$props.image1);
    		if ('image2' in $$props) $$invalidate(3, image2 = $$props.image2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [minutes, seconds, image1, image2, input0_input_handler, input1_input_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			minutes: 0,
    			seconds: 1,
    			image1: 2,
    			image2: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get minutes() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minutes(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get seconds() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set seconds(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image1() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image1(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image2() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image2(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map

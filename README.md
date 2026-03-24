# kernel-configurator

GitHub Action for modifying a Linux kernel `CONFIG` file with a smaller set of necessary changes.

## Usage

```yaml
- uses: OpenGamingCollective/kernel-configurator@v1.0.0
  with:
    config: path/to/CONFIG
    set: |
      path/to/CONFIG.set
      path/to/other/CONFIG.set
    unset: |
      path/to/CONFIG.unset
      path/to/other/CONFIG.unset
    output: path/to/out/CONFIG
```

### Inputs

| Input    | Required | Description                                                                              |
|----------|----------|------------------------------------------------------------------------------------------|
| `config` | yes      | Path to the kernel `CONFIG` file to modify                                               |
| `set`    | yes      | Path to one or multiple `SET` files. Applied in order.                                   |
| `unset`  | no       | Path to one or multiple `UNSET` files. Applied in order.                                 |
| `output` | no       | Output file path. (Modifies in-place if unset)                                           |

### `SET` File Format

Standard kernel config format, one entry per line:

```
CONFIG_ZENIFY=y
CONFIG_NTSYNC=m
CONFIG_MIN_BASE_SLICE_NS=1000000
```

### `UNSET` File Format

One config option name per line:

```
CONFIG_FB_SIMPLE
CONFIG_SECURITY_LOCKDOWN_LSM_EARLY
```

The action converts each set value to `# CONFIG_X is not set` in the target config. If no existing value is found nothing is changed.

## Development

```bash
npm install
npm run build    # bundles to dist/index.js
```

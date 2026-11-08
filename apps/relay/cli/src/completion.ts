export type SupportedShell = "bash" | "zsh" | "fish";

const BASH_COMPLETION = `
# relay bash completion script
_relay_completions() {
  local cur prev opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  opts="--host --gateway-port --no-browser --large-qr --json --help completion"

  case "\${prev}" in
    --host)
      return 0
      ;;
    --gateway-port)
      COMPREPLY=( $(compgen -W "7331 8080 3000" -- \${cur}) )
      return 0
      ;;
    completion)
      COMPREPLY=( $(compgen -W "bash zsh fish" -- \${cur}) )
      return 0
      ;;
    *)
      ;;
  esac

  if [[ \${cur} == -* ]] ; then
    COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
    return 0
  fi
}
complete -F _relay_completions relay
`.trim();

const ZSH_COMPLETION = `
#compdef relay
_relay() {
  local -a options
  options=(
    '--host[Hosting IP address (valid IPv4 or IPv6)]:host:'
    '--gateway-port[Port for Relay LAN gateway (default: 7331)]:port:'
    '--no-browser[Continue in CLI without opening browser]'
    '--large-qr[Display high-visibility large QR code for low-grade camera sensors]'
    '--json[Output newline-delimited JSON events for CI and automation]'
    '(-h --help)'{-h,--help}'[Show help message]'
    '1:port:(3000 5173 8080 8000 4200)'
  )
  _describe 'command' options
}
_relay
`.trim();

const FISH_COMPLETION = `
# relay fish completion script
complete -c relay -f
complete -c relay -l host -d 'Hosting IP address' -r
complete -c relay -l gateway-port -d 'Port for Relay LAN gateway' -r -a '7331 8080'
complete -c relay -l no-browser -d 'Continue in CLI without opening browser'
complete -c relay -l large-qr -d 'Display high-visibility large QR code'
complete -c relay -l json -d 'Output newline-delimited JSON events'
complete -c relay -s h -l help -d 'Show help message'
complete -c relay -n '__fish_use_subcommand' -a 'completion' -d 'Generate shell completion script'
`.trim();

export function generateShellCompletion(shell: SupportedShell): string {
  switch (shell) {
    case "bash":
      return BASH_COMPLETION;
    case "zsh":
      return ZSH_COMPLETION;
    case "fish":
      return FISH_COMPLETION;
    default:
      throw new Error(
        `Unsupported shell: ${shell}. Supported shells: bash, zsh, fish`,
      );
  }
}

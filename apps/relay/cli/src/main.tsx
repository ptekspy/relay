import { render } from "ink";
import { parseCliArgs } from "./args.js";
import { App } from "./ui/App.js";

const config = parseCliArgs();

render(<App config={config} />);

import { handleOrderBackend } from "../server/orderBackend";

const fetch = (request: Request): Promise<Response> =>
  handleOrderBackend(request);

export default { fetch };

'use strict';

import type ClientRecordType from '../../types/client.record.type';
import type {SqlRowType} from '../../types/sql.executor.type';
import optionalText from './optional.text';

const rowToClient = (row: SqlRowType): ClientRecordType => ({
	clientId: String(row.client_id),
	clientName: optionalText(row.client_name),
	redirectUris: JSON.parse(String(row.redirect_uris)),
	applicationType: optionalText(row.application_type),
	tokenEndpointAuthMethod: 'none',
	grantTypes: JSON.parse(String(row.grant_types)),
	responseTypes: JSON.parse(String(row.response_types)),
	createdAt: new Date(Number(row.created_at))
});
export default rowToClient;
